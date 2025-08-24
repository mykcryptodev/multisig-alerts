// OG Image components for transaction visualization

import { formatAddress } from '@/config/env';
import { ERC20TransactionDetails } from '@/lib/erc20-decoder';
import { ProfileInfo } from '@/lib/profile-resolver';

export interface TransactionImageProps {
  // Transaction data
  safeTxHash: string;
  chainName: string;
  toAddress: string;
  toAddressName: string;
  valueEth: string;
  confirmations: string;
  threshold: string;
  method?: string;
  
  // ERC-20 token details
  tokenDetails?: ERC20TransactionDetails;
  
  // Signers
  ownerProfiles: ProfileInfo[];
}

export function TransactionImage({
  safeTxHash,
  chainName,
  toAddress,
  toAddressName,
  valueEth,
  confirmations,
  threshold,
  method,
  tokenDetails,
  ownerProfiles,
}: TransactionImageProps) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: 'white',
        padding: '40px',
        fontFamily: 'Segment, sans-serif',
      }}
    >
      {/* Header */}
      <TransactionHeader tokenDetails={tokenDetails} />

      {/* ERC-20 Token Details */}
      {tokenDetails?.isApprove && (
        <ApprovalDetails tokenDetails={tokenDetails} />
      )}

      {tokenDetails?.isTransfer && (
        <TransferDetails tokenDetails={tokenDetails} />
      )}

      {/* Main Content Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          width: '100%',
          maxWidth: '900px',
          alignItems: 'center',
        }}
      >
        {/* Transaction Info Card - Only show if NOT an approval or transfer */}
        {!tokenDetails?.isApprove && !tokenDetails?.isTransfer && (
          <TransactionInfoCard
            toAddress={toAddress}
            toAddressName={toAddressName}
            valueEth={valueEth}
            confirmations={confirmations}
            threshold={threshold}
            method={method}
          />
        )}

        {/* Signers Section */}
        <SignersSection ownerProfiles={ownerProfiles} />
      </div>

      {/* Footer */}
      <TransactionFooter chainName={chainName} safeTxHash={safeTxHash} />
    </div>
  );
}

function TransactionHeader({ tokenDetails }: { tokenDetails?: ERC20TransactionDetails }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '30px',
        fontSize: '42px',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
      }}
    >
      {tokenDetails?.isApprove ? '🔐 New Token Approval' : 
       tokenDetails?.isTransfer ? '💸 New Token Transfer' : 
       '🔔 New Safe Transaction'}
    </div>
  );
}

function ApprovalDetails({ tokenDetails }: { tokenDetails: ERC20TransactionDetails }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '100%',
        maxWidth: '900px',
        backgroundColor: '#1e293b',
        padding: '25px',
        borderRadius: '16px',
        border: '2px solid #f59e0b',
        boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#f59e0b',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'center',
        }}
      >
        🔐 Approval Details
      </div>
      
      <DetailRow 
        label="Token:" 
        value={`${tokenDetails.tokenName} (${tokenDetails.tokenSymbol})`}
        valueColor="#10b981"
      />
      
      <DetailRow 
        label="Amount:" 
        value={`${tokenDetails.formattedAmount} ${tokenDetails.tokenSymbol}`}
        valueColor={tokenDetails.formattedAmount === 'Unlimited' ? '#ef4444' : '#f59e0b'}
      />
      
      <DetailRow 
        label="Spender:" 
        value={tokenDetails.spenderName || ''}
        valueColor="#8b5cf6"
        isMonospace={tokenDetails.spenderName === formatAddress(tokenDetails.spenderAddress || '')}
      />
    </div>
  );
}

function TransferDetails({ tokenDetails }: { tokenDetails: ERC20TransactionDetails }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '100%',
        maxWidth: '900px',
        backgroundColor: '#1e293b',
        padding: '25px',
        borderRadius: '16px',
        border: '2px solid #10b981',
        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#10b981',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'center',
        }}
      >
        💸 Transfer Details
      </div>
      
      <DetailRow 
        label="Token:" 
        value={`${tokenDetails.tokenName} (${tokenDetails.tokenSymbol})`}
        valueColor="#10b981"
      />
      
      <DetailRow 
        label="Amount:" 
        value={`${tokenDetails.formattedAmount} ${tokenDetails.tokenSymbol}`}
        valueColor="#10b981"
      />
      
      <DetailRow 
        label="Recipient:" 
        value={tokenDetails.recipientName || ''}
        valueColor="#60a5fa"
        isMonospace={tokenDetails.recipientName === formatAddress(tokenDetails.recipientAddress || '')}
      />
    </div>
  );
}

function TransactionInfoCard({
  toAddress,
  toAddressName,
  valueEth,
  confirmations,
  threshold,
  method,
}: {
  toAddress: string;
  toAddressName: string;
  valueEth: string;
  confirmations: string;
  threshold: string;
  method?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        backgroundColor: '#1e293b',
        padding: '30px',
        borderRadius: '16px',
        border: '2px solid #334155',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      }}
    >
      <DetailRow 
        icon="📤"
        label="To Address:" 
        value={toAddressName}
        valueColor="#10b981"
        isMonospace={toAddressName === formatAddress(toAddress)}
      />

      <DetailRow 
        icon="💰"
        label="Value:" 
        value={`${valueEth} ETH`}
        valueColor="#f59e0b"
      />

      <DetailRow 
        icon="✍️"
        label="Signatures:" 
        value={`${confirmations}/${threshold}`}
        valueColor="#ef4444"
        fontSize="24px"
      />

      {method && (
        <DetailRow 
          icon="⚡"
          label="Method:" 
          value={method}
          valueColor="#8b5cf6"
          isMonospace={true}
        />
      )}

    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
  isMonospace = false,
  fontSize = '20px',
}: {
  icon?: string;
  label: string;
  value: string;
  valueColor: string;
  isMonospace?: boolean;
  fontSize?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#94a3b8',
        }}
      >
        {icon && icon} {label}
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: isMonospace ? 'Segment, monospace' : 'Segment',
          fontWeight: 'bold',
          color: valueColor,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SignersSection({ ownerProfiles }: { ownerProfiles: ProfileInfo[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#94a3b8',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        👥 Signers
      </div>
      
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {ownerProfiles.map((profile, index) => (
          <SignerCard key={index} profile={profile} />
        ))}
      </div>
    </div>
  );
}

function SignerCard({ profile }: { profile: ProfileInfo }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '20px',
        backgroundColor: profile.hasSigned ? '#0f3f26' : '#1e293b',
        borderRadius: '12px',
        border: profile.hasSigned ? '2px solid #10b981' : '2px solid #334155',
        minWidth: '120px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        position: 'relative',
      }}
    >
      {/* Avatar */}
      {profile.avatar ? (
        <div
          style={{
            display: 'flex',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '3px solid #3b82f6',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={profile.avatar}
            alt={profile.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            border: '3px solid #1d4ed8',
          }}
        >
          {profile.name.charAt(0).toUpperCase()}
        </div>
      )}
      
      {/* Signed Checkmark */}
      {profile.hasSigned && (
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
          }}
        >
          ✅
        </div>
      )}
      
      {/* Name */}
      <div
        style={{
          display: 'flex',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          maxWidth: '100px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#e2e8f0',
        }}
      >
        {profile.name}
      </div>
    </div>
  );
}

function TransactionFooter({ chainName, safeTxHash }: { chainName: string; safeTxHash: string }) {
  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '16px',
        color: '#64748b',
      }}
    >
      <div style={{ display: 'flex' }}>
        Chain: {chainName}
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: 'Segment, monospace',
          fontSize: '14px',
        }}
      >
        TX: {safeTxHash.slice(0, 10)}...{safeTxHash.slice(-8)}
      </div>
    </div>
  );
}
