describe('Section anchors', () => {
  it('lands on #create-nfts when visited directly', () => {
    cy.visit('/#create-nfts');
    cy.location('hash').should('eq', '#create-nfts');
    cy.get('#create-nfts', { timeout: 10000 }).should('exist');
    
    // Verify section is near the top (within 20px tolerance for scroll-margin-top)
    cy.get('#create-nfts').then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      expect(Math.abs(rect.top)).to.be.lessThan(20);
    });
  });

  it('scrolls to Create NFTs when hash changes', () => {
    cy.visit('/');
    cy.window().then((win) => {
      win.location.hash = '#create-nfts';
    });
    cy.location('hash').should('eq', '#create-nfts');
    cy.get('#create-nfts', { timeout: 10000 }).should('exist');
  });

  it('navigates from marketplace to #create-nfts via sidebar', () => {
    cy.visit('/marketplace?tab=collections');
    cy.get('[data-testid="sidebar-create-nfts"]', { timeout: 10000 }).click();
    cy.location('pathname').should('eq', '/');
    cy.location('hash').should('eq', '#create-nfts');
    cy.get('#create-nfts', { timeout: 10000 }).should('exist');
    
    // Verify accurate positioning
    cy.get('#create-nfts').then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      expect(Math.abs(rect.top)).to.be.lessThan(20);
    });
  });

  it('navigates to marketplace from NFT preview cards', () => {
    cy.visit('/');
    cy.get('#create-nfts').scrollIntoView();
    cy.get('#create-nfts').within(() => {
      cy.contains('Explore the Marketplace').click();
    });
    cy.location('pathname').should('eq', '/marketplace');
  });

  it('navigates to mint from NFT preview cards', () => {
    cy.visit('/');
    cy.get('#create-nfts').scrollIntoView();
    cy.get('#create-nfts').within(() => {
      cy.contains('Start Creating').click();
    });
    cy.location('pathname').should('eq', '/mint');
  });
});
