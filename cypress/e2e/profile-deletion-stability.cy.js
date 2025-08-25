// CRITICAL: This test prevents regression of collection deletion UI stability
// Collections must NEVER disappear or cause scroll jumps during deletion
describe('Profile Collection Deletion Stability', () => {
  it('maintains UI stability during collection deletion', () => {
    // Mock wallet connection
    cy.window().then((win) => {
      win.localStorage.setItem('solana-wallet-connected', 'true');
    });

    cy.visit('/profile');
    
    // Wait for collections to load
    cy.get('[data-testid="collection-grid"]').should('be.visible');
    
    // Record initial scroll position
    cy.window().then((win) => {
      const initialScrollY = win.scrollY;
      
      // Find first collection delete button and click
      cy.get('[data-testid="collection-card"]').first().within(() => {
        cy.get('[data-testid="delete-collection"]').click();
      });
      
      // Confirm deletion
      cy.get('[data-testid="confirm-dialog"] button').contains('Delete').click();
      
      // CRITICAL: Verify UI never disappears and scroll doesn't jump
      cy.get('[data-testid="collection-grid"]').should('remain.visible');
      cy.window().then((newWin) => {
        expect(Math.abs(newWin.scrollY - initialScrollY)).to.be.lessThan(10);
      });
      
      // Verify collection was removed from UI
      cy.get('[data-testid="collection-card"]').should('have.length.lessThan', 3);
    });
  });
});