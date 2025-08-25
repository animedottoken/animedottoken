describe('Back to Top functionality', () => {
  beforeEach(() => {
    cy.visit('/profile');
    cy.wait(1000);
  });

  it('shows back to top button after scrolling down', () => {
    // Button should not be visible initially
    cy.get('[data-testid="back-to-top"]').should('not.exist');
    
    // Scroll down to trigger button visibility
    cy.scrollTo(0, 500);
    cy.wait(200);
    
    // Button should now be visible
    cy.get('[data-testid="back-to-top"]').should('be.visible');
    
    // Click button to scroll to top
    cy.get('[data-testid="back-to-top"]').click();
    cy.wait(500);
    
    // Should be back at top
    cy.window().then((win) => {
      expect(win.scrollY).to.be.lessThan(50);
    });
  });

  it('scrolls to top when clicking active bottom nav tab', () => {
    // Only test on mobile viewport
    cy.viewport(375, 667);
    
    // Scroll down first
    cy.scrollTo(0, 500);
    cy.wait(200);
    
    // Click on the active Profile tab (should be active since we're on /profile)
    cy.get('nav[class*="bottom-0"] a[href="/profile"]').click();
    cy.wait(500);
    
    // Should scroll to top
    cy.window().then((win) => {
      expect(win.scrollY).to.be.lessThan(50);
    });
  });
});