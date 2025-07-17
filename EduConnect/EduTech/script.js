document.addEventListener('DOMContentLoaded', () => {
    // Element for the animation
    const typingText = document.querySelector('.typing-text');

    // List of features
    const features = [
        'Search Admission',
        'Study Resources',
        'College Info',
        'Career & Scholarships',
        'Profile'
    ];

    let featureIndex = 0; // Current feature index
    let charIndex = 0; // Current character index
    let currentPhase = 'typing'; // Phases: 'typing', 'deleting'

    // Animation speeds
    const typingSpeed = 100; // Speed of typing (ms)
    const deletingSpeed = 50; // Speed of deleting (ms)
    const delayBetweenFeatures = 2000; // Delay before switching to the next feature (ms)

    function animate() {
        const currentFeature = features[featureIndex];

        if (currentPhase === 'typing') {
            // Phase 1: Type the feature name
            if (charIndex < currentFeature.length) {
                typingText.textContent = currentFeature.substring(0, charIndex + 1);
                charIndex++;
                setTimeout(animate, typingSpeed);
            } else {
                // Wait for a moment, then move to deleting the feature
                setTimeout(() => {
                    currentPhase = 'deleting';
                    animate();
                }, delayBetweenFeatures);
            }
        } else if (currentPhase === 'deleting') {
            // Phase 2: Delete the feature name
            if (charIndex >= 0) {
                typingText.textContent = currentFeature.substring(0, charIndex);
                charIndex--;
                setTimeout(animate, deletingSpeed);
            } else {
                // Move to the next feature
                featureIndex = (featureIndex + 1) % features.length; // Loop through features
                currentPhase = 'typing';
                charIndex = 0;
                setTimeout(animate, 0);
            }
        }
    }

    // Start the animation
    if (typingText) {
        animate();
    }
});