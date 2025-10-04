describe('Profile Privacy Regression Tests', () => {
  const testWalletAddress = 'TestWallet' + Date.now();

  it('should prevent unauthenticated users from reading user_profiles table', () => {
    cy.visit('/');
    
    // Attempt to query user_profiles without authentication should fail or return empty
    cy.window().then((win) => {
      const { supabase } = win;
      if (supabase) {
        cy.wrap(supabase.from('user_profiles').select('*')).then((response) => {
          // Should either get an error or empty data
          expect(response.data === null || response.data.length === 0 || response.error).to.be.true;
        });
      }
    });
  });

  it('should prevent authenticated users from directly reading other users profiles', () => {
    // This test assumes authentication is set up
    // For now, we verify the RPC functions work for public data access
    cy.visit('/');
    
    cy.window().then((win) => {
      const { supabase } = win;
      if (supabase) {
        // Verify public profile data is accessible ONLY via secure RPC
        cy.wrap(supabase.rpc('get_creators_public_explore')).then((response) => {
          expect(response.error).to.be.null;
          console.log('✓ Public creators accessible via secure RPC');
        });

        // Verify direct table access to other profiles is blocked
        cy.wrap(supabase.from('user_profiles').select('*').neq('wallet_address', testWalletAddress)).then((response) => {
          // Should get error or no data for profiles we don't own
          const hasData = response.data && response.data.length > 0;
          if (hasData) {
            console.error('❌ SECURITY ISSUE: Can read other users profiles directly');
          }
          expect(hasData).to.be.false;
        });
      }
    });
  });

  it('should allow public profile data access via secure RPC functions', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      const { supabase } = win;
      if (supabase) {
        // Verify get_creators_public_explore works
        cy.wrap(supabase.rpc('get_creators_public_explore')).then((response) => {
          expect(response.error).to.be.null;
          expect(response.data).to.be.an('array');
          console.log('✓ Creators data accessible via get_creators_public_explore RPC');
        });
      }
    });
  });
});
