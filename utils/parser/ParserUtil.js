const CommonParserUtil = require('./CommonParserUtil');

/**
 * Deep accessibility report parser
 */
function parseDeepAccessibilityReport(html) {
    return CommonParserUtil.parseReport(html, 'Accessibility', 'accessibility');
}

// ==================== COMPATIBILITY PARSERS ====================
/**
 * Deep compatibility report parser
 */
function parseDeepCompatibilityReport(html) {
    return CommonParserUtil.parseReport(html, 'Compatibility', 'priority');
}

// ==================== ERROR PARSERS ====================
/**
 * Deep error report parser
 */
function parseDeepErrorReport(html) {
    return CommonParserUtil.parseReport(html, 'Errors', 'priority');
}

// ==================== SEO/SEARCH PARSERS ====================
/**
 * Deep SEO/Search report parser
 */
function parseDeepSEOReport(html) {
    return CommonParserUtil.parseReport(html, 'SEO', 'priority');
}

// ==================== STANDARD PARSERS ====================
/**
 * Deep standard report parser
 */
function parseDeepStandardReport(html) {
    return CommonParserUtil.parseReport(html, 'Standards', 'priority');
}

// ==================== USABILITY PARSERS ====================
/**
 * Deep usability report parser
 */
function parseDeepUsabilityReport(html) {
    return CommonParserUtil.parseReport(html, 'Usability', 'priority');
}

// ==================== EXPORTS ====================
module.exports = {
    // Deep parsers
    parseDeepAccessibilityReport,
    parseDeepCompatibilityReport,
    parseDeepErrorReport,
    parseDeepSEOReport,
    parseDeepStandardReport,
    parseDeepUsabilityReport
};
