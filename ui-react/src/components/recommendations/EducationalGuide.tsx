/**
 * Educational Guide Component
 * Displays expanded educational content with action steps
 */

import React from 'react';

interface EducationalGuideProps {
  title: string;
  content: string;
  actionSteps?: string[];
  keyTakeaways?: string[];
  relatedTopics?: string[];
}

export const EducationalGuide: React.FC<EducationalGuideProps> = ({
  title,
  content,
  actionSteps,
  keyTakeaways,
  relatedTopics,
}) => {
  return (
    <div className="space-y-6">
      {/* Main Content */}
      <div className="prose max-w-none">
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
      </div>

      {/* Key Takeaways */}
      {keyTakeaways && keyTakeaways.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            Key Takeaways
          </h4>
          <ul className="space-y-2">
            {keyTakeaways.map((takeaway, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Steps */}
      {actionSteps && actionSteps.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Action Steps
          </h4>
          <ol className="space-y-3">
            {actionSteps.map((step, index) => (
              <li key={index} className="text-sm text-green-800 flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-200 text-green-900 rounded-full font-semibold text-xs flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="flex-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Related Topics */}
      {relatedTopics && relatedTopics.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Related Topics</h4>
          <div className="flex flex-wrap gap-2">
            {relatedTopics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 italic border-t border-gray-200 pt-4">
        This is educational content, not financial advice. Consult a licensed advisor for
        personalized guidance.
      </div>
    </div>
  );
};
