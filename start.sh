#!/bin/bash
# Render start script — works regardless of dashboard Start Command setting
exec python -m flask --app app run --host 0.0.0.0 --port "${PORT:-5000}"
