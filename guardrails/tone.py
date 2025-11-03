"""
Tone validation for SpendSense recommendations
Ensures recommendations use empowering, non-shaming language
"""

import re


# Prohibited words/phrases (shaming or judgmental language)
PROHIBITED_WORDS = [
    'bad habits',
    'overspending',
    'wasteful',
    'irresponsible',
    'foolish',
    'stupid',
    'careless',
    'you should',
    'you must',
    'you have to',
    'you failed',
    'you did wrong'
]

# Preferred phrases (empowering language)
PREFERRED_PHRASES = {
    'bad habits': 'spending patterns',
    'overspending': 'higher spending',
    'you should': 'you could',
    'you must': 'consider',
    'you failed': 'opportunity to improve',
    'wasteful': 'less efficient',
    'irresponsible': 'opportunity to optimize'
}


def validate_tone(text):
    """
    Validate that text uses appropriate tone

    Args:
        text: Text to validate

    Returns:
        tuple: (is_valid, violations, suggestions)
    """
    text_lower = text.lower()
    violations = []
    suggestions = []

    # Check for prohibited words
    for prohibited in PROHIBITED_WORDS:
        if prohibited in text_lower:
            violations.append(f"Contains prohibited phrase: '{prohibited}'")
            # Suggest alternative
            if prohibited in PREFERRED_PHRASES:
                suggestions.append(f"Replace '{prohibited}' with '{PREFERRED_PHRASES[prohibited]}'")

    # Check for overly directive language
    directive_patterns = [
        r'you (must|have to|need to|should)',
        r'you\'re (wrong|mistaken|failing)',
        r'don\'t (be|do|use)'
    ]

    for pattern in directive_patterns:
        matches = re.findall(pattern, text_lower)
        if matches:
            violations.append(f"Contains directive language: {matches}")

    is_valid = len(violations) == 0

    return is_valid, violations, suggestions


def sanitize_recommendation_text(text):
    """
    Sanitize recommendation text to use appropriate tone

    Args:
        text: Original text

    Returns:
        str: Sanitized text
    """
    sanitized = text

    # Replace prohibited phrases with preferred alternatives
    for prohibited, preferred in PREFERRED_PHRASES.items():
        pattern = re.compile(re.escape(prohibited), re.IGNORECASE)
        sanitized = pattern.sub(preferred, sanitized)

    # Replace directive language
    sanitized = re.sub(
        r'\byou (must|have to)\b',
        'consider',
        sanitized,
        flags=re.IGNORECASE
    )

    sanitized = re.sub(
        r'\byou should\b',
        'you could',
        sanitized,
        flags=re.IGNORECASE
    )

    sanitized = re.sub(
        r'\byou\'re (wrong|mistaken)\b',
        'there\'s an opportunity',
        sanitized,
        flags=re.IGNORECASE
    )

    return sanitized


def add_disclaimer(text):
    """
    Add required disclaimer to recommendation text

    Args:
        text: Recommendation text

    Returns:
        str: Text with disclaimer appended
    """
    disclaimer = "\n\nThis is educational content, not financial advice. Consult a licensed advisor for personalized guidance."
    return text + disclaimer


def validate_recommendation(recommendation):
    """
    Validate a complete recommendation object for tone compliance

    Args:
        recommendation: Recommendation dict with 'title', 'description', 'rationale'

    Returns:
        dict: Validation result with 'is_valid', 'violations', 'sanitized'
    """
    violations = []
    sanitized = recommendation.copy()

    # Check title
    title_valid, title_violations, _ = validate_tone(recommendation.get('title', ''))
    if not title_valid:
        violations.extend(title_violations)
        sanitized['title'] = sanitize_recommendation_text(recommendation.get('title', ''))

    # Check description
    desc_valid, desc_violations, _ = validate_tone(recommendation.get('description', ''))
    if not desc_valid:
        violations.extend(desc_violations)
        sanitized['description'] = sanitize_recommendation_text(recommendation.get('description', ''))

    # Check rationale
    rationale_valid, rationale_violations, _ = validate_tone(recommendation.get('rationale', ''))
    if not rationale_valid:
        violations.extend(rationale_violations)
        sanitized['rationale'] = sanitize_recommendation_text(recommendation.get('rationale', ''))

    # Add disclaimer if needed
    if 'disclaimer' not in sanitized or not sanitized.get('disclaimer'):
        sanitized['disclaimer'] = add_disclaimer('')

    return {
        'is_valid': len(violations) == 0,
        'violations': violations,
        'sanitized': sanitized
    }


if __name__ == '__main__':
    # Test tone validation
    test_texts = [
        "You should stop overspending on bad habits",
        "You could optimize your spending patterns",
        "You must reduce credit utilization",
        "Consider reducing credit utilization to improve your score"
    ]

    for text in test_texts:
        is_valid, violations, suggestions = validate_tone(text)
        print(f"\nText: '{text}'")
        print(f"Valid: {is_valid}")
        if violations:
            print(f"Violations: {violations}")
            print(f"Suggestions: {suggestions}")
        print(f"Sanitized: '{sanitize_recommendation_text(text)}'")

