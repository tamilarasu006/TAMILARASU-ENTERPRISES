import React from 'react';
import PageTransition from '../../components/PageTransition';

export default function FarmerEnquiries() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate mb-8">
          My Enquiries
        </h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center text-gray-500">
          No enquiries yet. Add some products to get started!
        </div>
      </div>
    </PageTransition>
  );
}
