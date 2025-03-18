import React from 'react';

interface OpenNotifAnimationProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

const OpenNotifAnimation: React.FC<OpenNotifAnimationProps> = ({
  width = "100%",
  height = "100%",
  className = "",
}) => {
  return (
    <div className={`open-notif-container ${className}`} style={{ width, height, overflow: 'hidden' }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 900 500"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        className="open-notif-animation"
      >
        {/* Define gradients and filters for better visuals */}
        <defs>
          <linearGradient id="awsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9900" />
            <stop offset="100%" stopColor="#ED8600" />
          </linearGradient>
          
          <linearGradient id="userGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#3D8B40" />
          </linearGradient>
          
          <filter id="shadowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#00000033" />
          </filter>
          
          <filter id="glowEffect" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>
        
        {/* Background with subtle pattern */}
        <rect width="900" height="500" fill="#f5f5f5" />
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#f5f5f5" />
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
        </pattern>
        <rect width="900" height="500" fill="url(#grid)" opacity="0.5" />
        
        {/* Title with animation */}
        <g filter="url(#shadowEffect)">
          <text x="450" y="50" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" textAnchor="middle" fill="#232F3E">
            Open-Notif: CLI for User-Company Connectivity
            <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" />
          </text>
        </g>
        
        {/* AWS Chalice - Increased size */}
        <rect id="chalice" x="100" y="90" width="150" height="90" rx="15" fill="url(#awsGradient)" stroke="#232F3E" strokeWidth="2" filter="url(#shadowEffect)">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="175" y="140" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#232F3E">
          AWS Chalice
        </text>
        
        {/* AWS SNS - Increased size */}
        <rect id="sns" x="375" y="90" width="150" height="90" rx="15" fill="url(#awsGradient)" stroke="#232F3E" strokeWidth="2" filter="url(#shadowEffect)">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="0.5s" />
        </rect>
        <text x="450" y="140" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#232F3E">
          AWS SNS
        </text>
        
        {/* SQS 1 - Increased size */}
        <rect id="sqs1" x="225" y="210" width="150" height="90" rx="15" fill="url(#awsGradient)" stroke="#232F3E" strokeWidth="2" filter="url(#shadowEffect)">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="1s" />
        </rect>
        <text x="300" y="260" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#232F3E">
          AWS SQS
        </text>
        
        {/* SQS 2 - Increased size */}
        <rect id="sqs2" x="525" y="210" width="150" height="90" rx="15" fill="url(#awsGradient)" stroke="#232F3E" strokeWidth="2" filter="url(#shadowEffect)">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="1s" />
        </rect>
        <text x="600" y="260" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#232F3E">
          AWS SQS
        </text>
        
        {/* Lambda 1 - Increased size */}
        <rect id="lambda1" x="225" y="330" width="150" height="90" rx="15" fill="url(#awsGradient)" stroke="#232F3E" strokeWidth="2" filter="url(#shadowEffect)">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="1.5s" />
        </rect>
        <text x="300" y="380" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#232F3E">
          AWS Lambda
        </text>
        
        {/* Lambda 2 - Increased size */}
        <rect id="lambda2" x="525" y="330" width="150" height="90" rx="15" fill="url(#awsGradient)" stroke="#232F3E" strokeWidth="2" filter="url(#shadowEffect)">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="1.5s" />
        </rect>
        <text x="600" y="380" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#232F3E">
          AWS Lambda
        </text>
        
        {/* User Call - Moved to left edge */}
        <rect id="usercall" x="50" y="430" width="170" height="60" rx="25" fill="url(#userGradient)" stroke="#232F3E" strokeWidth="2" filter="url(#shadowEffect)">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="2s" />
        </rect>
        <text x="135" y="468" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#232F3E">
          User Call
        </text>
        
        {/* User Email - Moved to right edge */}
        <rect id="useremail" x="680" y="430" width="170" height="60" rx="25" fill="url(#userGradient)" stroke="#232F3E" strokeWidth="2" filter="url(#shadowEffect)">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" begin="2s" />
        </rect>
        <text x="765" y="468" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#232F3E">
          User Email
        </text>
        
        {/* Enhanced connection paths with better visibility - Updated coordinates */}
        {/* Chalice to SNS */}
        <path id="path1-1" d="M240,135 L390,135" stroke="#232F3E" strokeWidth="3" fill="none">
          <animate attributeName="stroke-dasharray" values="1,15;15,1;1,15" dur="2s" repeatCount="indefinite" />
        </path>
        <polygon points="390,135 380,130 380,140" fill="#232F3E" />
        
        {/* SNS to SQS 1 */}
        <path id="path2-1" d="M450,170 Q450,195 325,220" stroke="#232F3E" strokeWidth="3" fill="none">
          <animate attributeName="stroke-dasharray" values="1,15;15,1;1,15" dur="2s" repeatCount="indefinite" />
        </path>
        <polygon points="325,220 335,215 335,225" fill="#232F3E" />
        
        {/* SNS to SQS 2 */}
        <path id="path2-2" d="M450,170 Q450,195 575,220" stroke="#232F3E" strokeWidth="3" fill="none">
          <animate attributeName="stroke-dasharray" values="1,15;15,1;1,15" dur="2s" repeatCount="indefinite" />
        </path>
        <polygon points="575,220 565,215 565,225" fill="#232F3E" />
        
        {/* SQS 1 to Lambda 1 */}
        <path id="path3-1" d="M300,290 L300,330" stroke="#232F3E" strokeWidth="3" fill="none">
          <animate attributeName="stroke-dasharray" values="1,15;15,1;1,15" dur="2s" repeatCount="indefinite" />
        </path>
        <polygon points="300,340 295,330 305,330" fill="#232F3E" />
        
        {/* SQS 2 to Lambda 2 */}
        <path id="path3-2" d="M600,290 L600,330" stroke="#232F3E" strokeWidth="3" fill="none">
          <animate attributeName="stroke-dasharray" values="1,15;15,1;1,15" dur="2s" repeatCount="indefinite" />
        </path>
        <polygon points="600,340 595,330 605,330" fill="#232F3E" />
        
        {/* Lambda 1 to User Call - Updated path */}
        <path id="path4-1" d="M300,410 Q300,425 135,440" stroke="#232F3E" strokeWidth="3" fill="none">
          <animate attributeName="stroke-dasharray" values="1,15;15,1;1,15" dur="2s" repeatCount="indefinite" />
        </path>
        <polygon points="135,440 145,435 145,445" fill="#232F3E" />
        
        {/* Lambda 2 to User Email - Updated path */}
        <path id="path4-2" d="M600,410 Q600,425 765,440" stroke="#232F3E" strokeWidth="3" fill="none">
          <animate attributeName="stroke-dasharray" values="1,15;15,1;1,15" dur="2s" repeatCount="indefinite" />
        </path>
        <polygon points="765,440 755,435 755,445" fill="#232F3E" />
        
        {/* Enhanced moving circles along paths - Updated paths */}
        {/* Path 1 - AWS Chalice to SNS */}
        <circle cx="0" cy="0" r="8" fill="#FF5722" filter="url(#glowEffect)">
          <animateMotion dur="2s" repeatCount="indefinite" rotate="auto" begin="0s">
            <mpath href="#path1-1" />
          </animateMotion>
          <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" />
        </circle>
        
        {/* Path 2-1 - SNS to SQS 1 */}
        <circle cx="0" cy="0" r="8" fill="#FF5722" filter="url(#glowEffect)">
          <animateMotion dur="2s" repeatCount="indefinite" rotate="auto" begin="2s">
            <mpath href="#path2-1" />
          </animateMotion>
          <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" begin="2s" />
        </circle>
        
        {/* Path 2-2 - SNS to SQS 2 */}
        <circle cx="0" cy="0" r="8" fill="#FF5722" filter="url(#glowEffect)">
          <animateMotion dur="2s" repeatCount="indefinite" rotate="auto" begin="2.5s">
            <mpath href="#path2-2" />
          </animateMotion>
          <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" begin="2.5s" />
        </circle>
        
        {/* Path 3-1 - SQS 1 to Lambda 1 */}
        <circle cx="0" cy="0" r="8" fill="#FF5722" filter="url(#glowEffect)">
          <animateMotion dur="1.5s" repeatCount="indefinite" rotate="auto" begin="4s">
            <mpath href="#path3-1" />
          </animateMotion>
          <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" begin="4s" />
        </circle>
        
        {/* Path 3-2 - SQS 2 to Lambda 2 */}
        <circle cx="0" cy="0" r="8" fill="#FF5722" filter="url(#glowEffect)">
          <animateMotion dur="1.5s" repeatCount="indefinite" rotate="auto" begin="4.5s">
            <mpath href="#path3-2" />
          </animateMotion>
          <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" begin="4.5s" />
        </circle>
        
        {/* Path 4-1 - Lambda 1 to User Call */}
        <circle cx="0" cy="0" r="8" fill="#FF5722" filter="url(#glowEffect)">
          <animateMotion dur="1.5s" repeatCount="indefinite" rotate="auto" begin="5.5s">
            <mpath href="#path4-1" />
          </animateMotion>
          <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" begin="5.5s" />
        </circle>
        
        {/* Path 4-2 - Lambda 2 to User Email */}
        <circle cx="0" cy="0" r="8" fill="#FF5722" filter="url(#glowEffect)">
          <animateMotion dur="1.5s" repeatCount="indefinite" rotate="auto" begin="6s">
            <mpath href="#path4-2" />
          </animateMotion>
          <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" begin="6s" />
        </circle>
        
        {/* Continuous flow animation showing complete path - Updated coordinates */}
        <g>
          {/* Path 1 - Complete flow through left side - Updated end point */}
          <circle cx="0" cy="0" r="6" fill="#4CAF50" filter="url(#glowEffect)">
            <animate attributeName="opacity" values="1;0.7;1" dur="1s" repeatCount="indefinite" />
            <animateMotion 
              path="M180,135 L390,135 L450,135 Q450,195 325,220 L300,220 L300,330 Q300,425 135,440" 
              dur="8s" 
              repeatCount="indefinite"
              rotate="auto"
              keyPoints="0;0.15;0.3;0.5;0.7;0.85;1"
              keyTimes="0;0.15;0.3;0.5;0.7;0.85;1"
              calcMode="linear"
            />
          </circle>
          
          {/* Path 2 - Complete flow through right side - Updated end point */}
          <circle cx="0" cy="0" r="6" fill="#4CAF50" filter="url(#glowEffect)">
            <animate attributeName="opacity" values="1;0.7;1" dur="1s" repeatCount="indefinite" begin="4s" />
            <animateMotion 
              path="M450,135 Q450,195 575,220 L600,220 L600,330 Q600,425 765,440" 
              dur="8s" 
              repeatCount="indefinite"
              begin="4s"
              rotate="auto"
              keyPoints="0;0.2;0.4;0.6;0.8;1"
              keyTimes="0;0.2;0.4;0.6;0.8;1"
              calcMode="linear"
            />
          </circle>
        </g>
        
        {/* Additional visual enhancements - Updated for larger box sizes and positions */}
        <g>
          {/* Pulsing highlight on the active component */}
          <rect id="highlight-chalice" x="98" y="88" width="154" height="94" rx="17" fill="none" stroke="#FF5722" strokeWidth="2">
            <animate attributeName="opacity" values="0;1;0" dur="8s" repeatCount="indefinite" begin="0s" />
            <animate attributeName="stroke-width" values="2;4;2" dur="8s" repeatCount="indefinite" begin="0s" />
          </rect>
          
          <rect id="highlight-sns" x="373" y="88" width="154" height="94" rx="17" fill="none" stroke="#FF5722" strokeWidth="2">
            <animate attributeName="opacity" values="0;1;0" dur="8s" repeatCount="indefinite" begin="1s" />
            <animate attributeName="stroke-width" values="2;4;2" dur="8s" repeatCount="indefinite" begin="1s" />
          </rect>
          
          <rect id="highlight-sqs1" x="223" y="208" width="154" height="94" rx="17" fill="none" stroke="#FF5722" strokeWidth="2">
            <animate attributeName="opacity" values="0;1;0" dur="8s" repeatCount="indefinite" begin="2s" />
            <animate attributeName="stroke-width" values="2;4;2" dur="8s" repeatCount="indefinite" begin="2s" />
          </rect>
          
          <rect id="highlight-sqs2" x="523" y="208" width="154" height="94" rx="17" fill="none" stroke="#FF5722" strokeWidth="2">
            <animate attributeName="opacity" values="0;1;0" dur="8s" repeatCount="indefinite" begin="2.5s" />
            <animate attributeName="stroke-width" values="2;4;2" dur="8s" repeatCount="indefinite" begin="2.5s" />
          </rect>
          
          <rect id="highlight-lambda1" x="223" y="328" width="154" height="94" rx="17" fill="none" stroke="#FF5722" strokeWidth="2">
            <animate attributeName="opacity" values="0;1;0" dur="8s" repeatCount="indefinite" begin="3s" />
            <animate attributeName="stroke-width" values="2;4;2" dur="8s" repeatCount="indefinite" begin="3s" />
          </rect>
          
          <rect id="highlight-lambda2" x="523" y="328" width="154" height="94" rx="17" fill="none" stroke="#FF5722" strokeWidth="2">
            <animate attributeName="opacity" values="0;1;0" dur="8s" repeatCount="indefinite" begin="3.5s" />
            <animate attributeName="stroke-width" values="2;4;2" dur="8s" repeatCount="indefinite" begin="3.5s" />
          </rect>
          
          <rect id="highlight-usercall" x="48" y="428" width="174" height="64" rx="27" fill="none" stroke="#FF5722" strokeWidth="2">
            <animate attributeName="opacity" values="0;1;0" dur="8s" repeatCount="indefinite" begin="4s" />
            <animate attributeName="stroke-width" values="2;4;2" dur="8s" repeatCount="indefinite" begin="4s" />
          </rect>
          
          <rect id="highlight-useremail" x="678" y="428" width="174" height="64" rx="27" fill="none" stroke="#FF5722" strokeWidth="2">
            <animate attributeName="opacity" values="0;1;0" dur="8s" repeatCount="indefinite" begin="4.5s" />
            <animate attributeName="stroke-width" values="2;4;2" dur="8s" repeatCount="indefinite" begin="4.5s" />
          </rect>
        </g>
      </svg>
    </div>
  );
};

export default OpenNotifAnimation;
