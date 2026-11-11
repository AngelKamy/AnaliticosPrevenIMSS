const footer = document.querySelector('[data-site-footer]');
const links = document.querySelector('.site-nav ul');
if (footer && links) {
    const shell = document.createElement('div');
    shell.className = 'site-shell site-footer-inner';
    const map = document.createElement('nav');
    map.setAttribute('aria-labelledby', 'footerSiteMap');
    const heading = document.createElement('h2');
    heading.id = 'footerSiteMap';
    heading.textContent = 'Mapa del sitio';
    map.append(heading, links.cloneNode(true));

    const credits = document.createElement('div');
    const creditHeading = document.createElement('h2');
    creditHeading.textContent = 'Créditos de desarrollo';
    const name = document.createElement('p');
    name.textContent = 'Plataforma desarrollada por: Angel Ivan Vasquez Quiroz';
    const contact = document.createElement('p');
    const email = document.createElement('a');
    email.href = 'mailto:angel.vazquez@imss.gob.mx';
    email.textContent = 'angel.vazquez@imss.gob.mx';
    contact.append('Contacto: ', email);
    credits.append(creditHeading, name, contact);
    shell.append(map, credits);
    footer.append(shell);
}
