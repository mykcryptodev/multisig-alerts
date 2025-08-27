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
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 229, 204, 0.15) 25%, rgba(94, 242, 160, 0.15) 50%, rgba(184, 255, 107, 0.15) 75%, rgba(255, 229, 92, 0.15) 100%)',
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '30px',
        gap: '10px',
      }}
    >
      {/* Siggy Branding */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          fontSize: '32px',
          fontFamily: 'LilitaOne, cursive',
          fontWeight: '400',
          background: 'linear-gradient(135deg, #00D4FF 0%, #00E5CC 25%, #5EF2A0 50%, #B8FF6B 75%, #FFE55C 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        <img 
          src="/images/siggy.png" 
          alt="Siggy the Parrot" 
          style={{
            width: '40px',
            height: '40px',
            marginRight: '10px',
          }}
        />
        Siggy Alert!
      </div>
      
      {/* Transaction Type */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '38px',
          fontFamily: 'LilitaOne, cursive',
          fontWeight: '400',
          background: 'linear-gradient(135deg, #00D4FF 0%, #00E5CC 25%, #5EF2A0 50%, #B8FF6B 75%, #FFE55C 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {tokenDetails?.isApprove ? '🔐 New Token Approval' : 
         tokenDetails?.isTransfer ? '💸 New Token Transfer' : 
         '🔔 New Safe Transaction'}
      </div>
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
        borderRadius: '24px',
        border: '3px solid',
        borderImage: 'linear-gradient(135deg, #00D4FF 0%, #FFE55C 100%) 1',
        boxShadow: '0 15px 35px rgba(0, 212, 255, 0.3)',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: '24px',
          fontFamily: 'LilitaOne, cursive',
          fontWeight: '400',
          background: 'linear-gradient(135deg, #00D4FF 0%, #FFE55C 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
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
        valueColor="#00E5CC"
      />
      
      <DetailRow 
        label="Amount:" 
        value={`${tokenDetails.formattedAmount} ${tokenDetails.tokenSymbol}`}
        valueColor={tokenDetails.formattedAmount === 'Unlimited' ? '#ef4444' : '#FFE55C'}
      />
      
      <DetailRow 
        label="Spender:" 
        value={tokenDetails.spenderName || ''}
        valueColor="#5EF2A0"
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
        borderRadius: '24px',
        border: '3px solid',
        borderImage: 'linear-gradient(135deg, #5EF2A0 0%, #B8FF6B 100%) 1',
        boxShadow: '0 15px 35px rgba(94, 242, 160, 0.3)',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: '24px',
          fontFamily: 'LilitaOne, cursive',
          fontWeight: '400',
          background: 'linear-gradient(135deg, #5EF2A0 0%, #B8FF6B 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
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
        valueColor="#5EF2A0"
      />
      
      <DetailRow 
        label="Amount:" 
        value={`${tokenDetails.formattedAmount} ${tokenDetails.tokenSymbol}`}
        valueColor="#B8FF6B"
      />
      
      <DetailRow 
        label="Recipient:" 
        value={tokenDetails.recipientName || ''}
        valueColor="#00D4FF"
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
        borderRadius: '24px',
        border: '3px solid',
        borderImage: 'linear-gradient(135deg, #00D4FF 0%, #00E5CC 50%, #5EF2A0 100%) 1',
        boxShadow: '0 15px 35px rgba(0, 212, 255, 0.2)',
      }}
    >
      <DetailRow 
        icon="📤"
        label="To Address:" 
        value={toAddressName}
        valueColor="#00E5CC"
        isMonospace={toAddressName === formatAddress(toAddress)}
      />

      <DetailRow 
        icon="💰"
        label="Value:" 
        value={`${valueEth} ETH`}
        valueColor="#FFE55C"
      />

      <DetailRow 
        icon="✍️"
        label="Signatures:" 
        value={`${confirmations}/${threshold}`}
        valueColor="#B8FF6B"
        fontSize="24px"
      />

      {method && (
        <DetailRow 
          icon="⚡"
          label="Method:" 
          value={method}
          valueColor="#5EF2A0"
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
          fontFamily: 'LilitaOne, cursive',
          fontWeight: '400',
          background: 'linear-gradient(135deg, #00D4FF 0%, #5EF2A0 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
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
        backgroundColor: profile.hasSigned ? 'rgba(94, 242, 160, 0.1)' : '#1e293b',
        borderRadius: '16px',
        border: profile.hasSigned ? '3px solid #5EF2A0' : '3px solid #334155',
        minWidth: '120px',
        boxShadow: profile.hasSigned ? '0 8px 25px rgba(94, 242, 160, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.2)',
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
            border: '3px solid #00D4FF',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
            background: 'linear-gradient(135deg, #00D4FF 0%, #00E5CC 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            border: '3px solid #00D4FF',
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
            background: 'linear-gradient(135deg, #5EF2A0 0%, #B8FF6B 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 2px 8px rgba(94, 242, 160, 0.4)',
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
        color: '#94a3b8',
        fontFamily: 'Segment, sans-serif',
      }}
    >
      <div 
        style={{ 
          display: 'flex',
          color: '#00E5CC',
          fontWeight: 'bold',
        }}
      >
        🌐 {chainName}
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: 'Segment, monospace',
          fontSize: '14px',
          color: '#FFE55C',
          fontWeight: 'bold',
        }}
      >
        TX: {safeTxHash.slice(0, 10)}...{safeTxHash.slice(-8)}
      </div>
    </div>
  );
}
