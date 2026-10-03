import React from 'react';
import { IssueResolutionModal, IssueResolutionModalProps } from './IssueResolutionModal';

/**
 * Replaced narrow slide-over drawer with modern Centered Issue Resolution Modal
 * Fully backwards-compatible with all existing props.
 */
export const IssueDetailDrawer: React.FC<IssueResolutionModalProps> = (props) => {
  return <IssueResolutionModal {...props} />;
};

export { IssueResolutionModal };
export type { IssueResolutionModalProps };
