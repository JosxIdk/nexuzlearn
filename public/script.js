
const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement; 
        const answer = faqItem.querySelector('.faq-answer');
        faqQuestions.forEach(q => {
            const parent = q.parentElement;
            if (parent !== faqItem) {
                parent.classList.remove('active');
            }
        });
        faqItem.classList.toggle('active');
    });
});
