document.addEventListener('scroll', function () {
    const templates = document.querySelectorAll('.templates');
    const lines = document.querySelectorAll('.lines, #lines2'); 
    const triggerPoint = window.innerHeight * 0.75; 

    templates.forEach(template => {
        const templatePosition = template.getBoundingClientRect().top;
        if (templatePosition < triggerPoint) {
            template.classList.add('visible'); 
        } else {
            template.classList.remove('visible'); 
        }
    });

    lines.forEach(line => {
        const linePosition = line.getBoundingClientRect().top;
        if (linePosition < triggerPoint) {
            line.classList.add('visible'); 
        } else {
            line.classList.remove('visible'); 
        }
    });
});
