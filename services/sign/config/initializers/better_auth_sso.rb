# services/sign/config/initializers/better_auth_sso.rb
# BetterAuth SSO integration for DocuSeal
# Auto-provisions users from Caddy X-Alecia-User-* headers

Rails.application.config.middleware.insert_before 0, Class.new do
  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)

    # Extract BetterAuth headers from Caddy
    user_id = request.get_header('HTTP_X_ALECIA_USER_ID')
    user_email = request.get_header('HTTP_X_ALECIA_USER_EMAIL')
    user_name = request.get_header('HTTP_X_ALECIA_USER_NAME')
    user_role = request.get_header('HTTP_X_ALECIA_USER_ROLE')

    if user_id && user_email
      begin
        # Find or create DocuSeal user
        user = User.find_or_initialize_by(email: user_email)

        if user.new_record?
          # Auto-provision new user
          user.first_name = user_name&.split(' ')&.first || user_email.split('@').first
          user.last_name = user_name&.split(' ')&.drop(1)&.join(' ') || ''
          user.role = user_role == 'admin' ? 'admin' : 'user'
          user.password = SecureRandom.hex(32) # Random password (SSO only)
          user.confirmed_at = Time.current # Skip email confirmation
          user.save!

          Rails.logger.info "[BetterAuth SSO] Auto-provisioned DocuSeal user: #{user_email} (#{user.role})"
        end

        # Sign in the user for this request
        # Set env variables that Devise/Warden use
        env['warden'].set_user(user, scope: :user)
        env['devise.skip_session_storage'] = false

        Rails.logger.debug "[BetterAuth SSO] Authenticated user: #{user_email}"
      rescue => e
        Rails.logger.error "[BetterAuth SSO] Error processing auth headers: #{e.message}"
        # Continue without auth if something goes wrong
      end
    end

    @app.call(env)
  end
end
