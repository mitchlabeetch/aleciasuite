# services/flows/scripts/setup-sso.sh
# Setup script for Activepieces BetterAuth SSO integration
# Runs on container startup to configure SSO

#!/bin/bash
set -e

echo "[BetterAuth SSO] Setting up Activepieces SSO integration..."

# Activepieces supports environment-based SSO configuration
# Configure to trust headers from Caddy proxy

export AP_SSO_ENABLED=true
export AP_SSO_PROVIDER=header
export AP_SSO_USER_ID_HEADER=X-Alecia-User-Id
export AP_SSO_USER_EMAIL_HEADER=X-Alecia-User-Email
export AP_SSO_USER_NAME_HEADER=X-Alecia-User-Name

echo "[BetterAuth SSO] Activepieces SSO configured"
echo "  - User ID Header: $AP_SSO_USER_ID_HEADER"
echo "  - User Email Header: $AP_SSO_USER_EMAIL_HEADER"
echo "  - User Name Header: $AP_SSO_USER_NAME_HEADER"

# Note: Actual header-based SSO may require Activepieces Enterprise
# For CE, we may need to implement a custom authentication strategy
# This is a placeholder for the configuration approach
