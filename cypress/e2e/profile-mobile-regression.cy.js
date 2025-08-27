describe('Profile Mobile Regression', () => {
  beforeEach(() => {
    cy.visit('/profile');
  });

  it('should display profile correctly on mobile viewport', () => {
    // Switch to iPhone viewport
    cy.viewport('iphone-x');
    
    // Wait for any loading states
    cy.wait(2000);
    
    // Verify key profile elements are visible on mobile
    cy.get('[data-testid="profile-banner"]').should('be.visible');
    cy.get('[data-testid="profile-avatar"]').should('be.visible');
    cy.get('[data-testid="profile-name"]').should('be.visible');
    
    // Verify bio section if present
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="profile-bio"]').length) {
        cy.get('[data-testid="profile-bio"]').should('be.visible');
        cy.get('[data-testid="profile-bio"]').should('not.have.css', 'height', '0px');
      }
    });
    
    // Verify tabs are accessible
    cy.get('[role="tablist"]').should('be.visible');
    cy.get('[role="tab"]').first().should('be.visible');
    
    // Switch back to desktop and then to mobile again to test persistence
    cy.viewport(1280, 720);
    cy.wait(1000);
    cy.viewport('iphone-x');
    cy.wait(1000);
    
    // Verify elements are still visible after viewport changes
    cy.get('[data-testid="profile-banner"]').should('be.visible');
    cy.get('[data-testid="profile-avatar"]').should('be.visible');
    cy.get('[data-testid="profile-name"]').should('be.visible');
  });

  it('should handle bio text wrapping correctly on mobile', () => {
    cy.viewport('iphone-x');
    
    // Check if bio exists and has proper text wrapping
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="profile-bio"]').length) {
        cy.get('[data-testid="profile-bio"]')
          .should('have.css', 'word-break', 'break-word')
          .or('have.css', 'overflow-wrap', 'break-word');
      }
    });
  });

  it('should maintain layout stability during viewport changes', () => {
    // Start on desktop
    cy.viewport(1280, 720);
    
    // Get initial positions
    let initialBannerHeight;
    cy.get('[data-testid="profile-banner"]').then(($banner) => {
      initialBannerHeight = $banner.height();
    });
    
    // Switch to mobile
    cy.viewport('iphone-x');
    cy.wait(500);
    
    // Verify layout didn't break
    cy.get('[data-testid="profile-banner"]').should('be.visible');
    cy.get('[data-testid="profile-avatar"]').should('be.visible');
    
    // Switch back to desktop
    cy.viewport(1280, 720);
    cy.wait(500);
    
    // Verify desktop layout is restored
    cy.get('[data-testid="profile-banner"]').should('be.visible');
    cy.get('[data-testid="profile-avatar"]').should('be.visible');
  });
});