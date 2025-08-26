describe('Section anchors', () => {
  it('lands on #create-nfts when visited directly', () => {
    cy.visit('/#create-nfts');
    cy.location('hash').should('eq', '#create-nfts');
    cy.get('#create-nfts', { timeout: 10000 }).should('exist');
  });

  it('scrolls to Create NFTs when hash changes', () => {
    cy.visit('/');
    cy.window().then((win) => {
      win.location.hash = '#create-nfts';
    });
    cy.location('hash').should('eq', '#create-nfts');
    cy.get('#create-nfts', { timeout: 10000 }).should('exist');
  });
});
