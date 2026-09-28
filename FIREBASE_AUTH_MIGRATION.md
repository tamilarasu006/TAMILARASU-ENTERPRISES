# FIREBASE_AUTH_MIGRATION

## 1. Current Authentication Architecture
- **Client (React/Vite)**: Uses `AuthContext` with a localStorage token (`token`) to manage sessions. Stores `user` object.
- **Server (Express)**: Exposes REST APIs in `auth.routes.js` and `profile.routes.js`. Employs `authenticateUser` middleware that extracts Bearer token, verifies JWT, and fetches user.
- **Tokens**: JSON Web Tokens (JWT) signed with `JWT_SECRET` (1 day for normal login, 30 days for OTP login/persistent sessions).
- **Google Login**: Handled via `@react-oauth/google` sending Google Credential to the backend, which verifies the token via `google-auth-library` and issues a local JWT.

## 2. Existing OTP Implementation
- Currently relies on a backend-owned OTP flow. 
- Models: `OTPVerification` stores `otpHash`, `channel` (MOBILE or EMAIL), `expiresAt`, etc.
- Routes: `/send-mobile-otp`, `/verify-mobile-otp`, `/login/otp/request`, `/login/otp/verify`, `/change-phone/request`, `/change-phone/verify`.
- SMS Service: Located in `server/src/services/smsService.js` (abstracted, currently simulating or hooked to MSG91/Twilio).
- Security: Backend verifies hashed OTP using `bcrypt.compare`. Limited to 5 requests/hour.

## 3. Existing User Model
- **Model**: `User`
- **Fields**: `id`, `name`, `email`, `phone`, `password`, `googleId`, `authProvider`, `role` (CUSTOMER, ADMIN, SUPER_ADMIN), `emailVerified`, `phoneVerified`, `createdAt`, `updatedAt`, and additional profile fields (e.g. `address`, `city`).
- The `phone` field is marked as `@unique`.

## 4. Existing JWT Flow
- When a user logs in, `jwt.sign` signs a payload containing `{ id: user.id }`.
- The frontend stores the token in `localStorage` and includes it as a Bearer token in the `Authorization` header via Axios.

## 5. Existing Firebase Implementation
- **Client**: `firebase` package (`^12.19.0`) is installed in `client/package.json`.
- No actual `client/src/firebase/` configuration or logic exists yet.
- **Server**: `firebase-admin` is NOT yet installed in `server/package.json`. No Firebase admin validation middleware exists.

## 6. What Will Be Changed
- **Client Auth Flow**: The frontend will trigger Firebase `RecaptchaVerifier` and `signInWithPhoneNumber` instead of hitting the backend `/login/otp/request` endpoints directly.
- **Client UI**: `Login.jsx` and `Register.jsx` (and potentially `Profile.jsx` / `VerifyAccount.jsx`) will integrate Firebase's OTP UI flow.
- **Backend Auth Endpoints**: We will create a new endpoint `POST /api/auth/firebase/phone` that accepts a Firebase `idToken` from the client.
- **OTP Generation & SMS**: Firebase completely takes over SMS delivery and OTP validation for Mobile numbers. 
- **Database Schema**: The `User` model may be extended with a `firebaseUid` field to cleanly map Firebase accounts to local application accounts.

## 7. What Will Remain Unchanged
- **Application JWT**: The long-lived application sessions will still rely on the local Express JWT system. Firebase is merely an *authentication provider*.
- **Database/Prisma**: The primary source of truth for the User continues to be the PostgreSQL database via Prisma.
- **Email OTP & Password Login**: Email verification (using Brevo/nodemailer) and standard email+password login remain totally unaffected.
- **Roles & Permissions**: RBAC using the existing backend JWT roles remains.
- **Google Auth**: Existing Google Auth remains the same.
- The `OTPVerification` table will remain for Email OTP flows (and forgot password flows).

## 8. Required Firebase Configuration
- Create a Firebase Project in the Firebase Console.
- Register a Web App and obtain standard Client SDK keys (`apiKey`, `authDomain`, `projectId`, etc.).
- Enable **Authentication** -> **Phone** provider.
- Add authorized domains (localhost, production URL).
- Create a Firebase Service Account and generate a private key JSON.

## 9. Required Backend Configuration
- Install `firebase-admin`.
- Initialize `firebase-admin` in `server/src/config/firebaseAdmin.js` using service account secrets stored safely in environment variables.
- New route handler in `auth.controller.js` to run `admin.auth().verifyIdToken(req.body.idToken)`.

## 10. Migration Risks
- **Phone Number Formatting**: Firebase heavily strictly enforces E.164 formats (`+91XXXXXXXXXX`). Existing records lacking the `+91` prefix will cause duplicate accounts or matching failures.
- **reCAPTCHA Handling**: React re-renders can accidentally instantiate multiple hidden reCAPTCHA instances, breaking the frontend ("reCAPTCHA already rendered" error). Proper unmount cleanup is critical.
- **Existing User Syncing**: Logging in via a phone number that is already associated with an admin account or an existing customer without a `firebaseUid` must be linked carefully without introducing security flaws (never granting admin rights implicitly).
