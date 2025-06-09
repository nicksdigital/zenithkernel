import { jsx } from '../../modules/Rendering/jsx-runtime';

export interface HydraTrustBarProps {
  /** Unique identifier for the Hydra instance */
  hydraId: string;
  /** Peer ID that provided this component */
  peerId: string;
  /** Execution type of the component */
  execType: 'local' | 'remote' | 'edge';
  /** Entry point for the component */
  entry: string;
  /** Optional ZK proof for verification */
  zkProof?: string;
  /** Optional trust score (0-100) */
  trustScore?: number;
  /** Callback when user clicks for more details */
  onDetailsClick?: (hydraId: string) => void;
}

/**
 * HydraTrustBar - Displays trust and verification information for Hydra components
 * 
 * Shows verification status, trust level, execution type, and allows users to
 * view detailed trust and security information about loaded Hydra components.
 */
export function HydraTrustBar(props: HydraTrustBarProps): HTMLElement | DocumentFragment {
  const {
    hydraId,
    peerId,
    execType,
    entry,
    zkProof,
    trustScore,
    onDetailsClick
  } = props;

  const isVerified = Boolean(zkProof);
  const isLocal = execType === 'local';
  
  const handleClick = () => {
    if (onDetailsClick) {
      onDetailsClick(hydraId);
    }
  };

  const getExecutionTypeClass = () => {
    return `trust-bar-${execType}`;
  };

  const renderVerificationStatus = () => {
    if (isLocal) {
      return jsx('div', {
        className: 'trust-level',
        'data-testid': 'trust-level-local',
        children: jsx('span', {
          className: 'trust-label',
          children: 'Local'
        })
      });
    }

    return jsx('div', {
      className: 'verification-status',
      children: isVerified
        ? jsx('div', {
            className: 'verified',
            'data-testid': 'verified-icon',
            children: [
              jsx('span', { className: 'status-icon', children: '✓' }),
              jsx('span', { className: 'status-text', children: 'Verified' })
            ]
          })
        : jsx('div', {
            className: 'unverified',
            'data-testid': 'unverified-icon',
            children: [
              jsx('span', { className: 'status-icon', children: '⚠' }),
              jsx('span', { className: 'status-text', children: 'Unverified' })
            ]
          })
    });
  };

  const renderTrustScore = () => {
    if (trustScore !== undefined) {
      return jsx('div', {
        className: 'trust-score',
        'data-testid': `trust-score-${trustScore}`,
        children: jsx('span', { children: `Trust: ${trustScore}%` })
      });
    }
    return null;
  };

  const barStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: isLocal ? '#e8f5e8' : isVerified ? '#e8f4fd' : '#fff3cd',
    border: `1px solid ${isLocal ? '#28a745' : isVerified ? '#007bff' : '#ffc107'}`,
    borderRadius: '4px',
    fontSize: '12px',
    cursor: onDetailsClick ? 'pointer' : 'default',
    transition: 'background-color 0.2s ease'
  };

  const leftSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const hydraIdStyle = {
    fontWeight: 'bold',
    color: '#333'
  };

  const peerIdStyle = {
    color: '#666',
    fontFamily: 'monospace'
  };

  const entryStyle = {
    color: '#666',
    fontStyle: 'italic'
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  return jsx('div', {
    className: `trust-bar ${getExecutionTypeClass()}`,
    'data-testid': `trust-bar-${hydraId}`,
    style: barStyle,
    onClick: handleClick,
    children: [
      jsx('div', {
        style: leftSectionStyle,
        children: [
          jsx('span', { style: hydraIdStyle, children: hydraId }),
          jsx('span', { style: peerIdStyle, children: peerId }),
          jsx('span', { style: entryStyle, children: entry }),
          jsx('span', { className: 'exec-type', children: execType })
        ]
      }),
      jsx('div', {
        style: rightSectionStyle,
        children: [
          renderTrustScore(),
          renderVerificationStatus()
        ]
      })
    ]
  });
}
