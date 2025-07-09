
import React from 'react';

const FamilyIcon = ({ className = "" }: { className?: string }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Adult figures */}
      <circle cx="25" cy="25" r="8" fill="currentColor" opacity="0.8"/>
      <circle cx="45" cy="25" r="8" fill="currentColor" opacity="0.8"/>
      
      {/* Child figures */}
      <circle cx="65" cy="35" r="6" fill="currentColor" opacity="0.6"/>
      <circle cx="80" cy="35" r="6" fill="currentColor" opacity="0.6"/>
      
      {/* Connection lines */}
      <line x1="25" y1="33" x2="25" y2="45" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
      <line x1="45" y1="33" x2="45" y2="45" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
      <line x1="25" y1="45" x2="45" y2="45" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
      <line x1="35" y1="45" x2="35" y2="55" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
      <line x1="35" y1="55" x2="72.5" y2="55" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
      <line x1="65" y1="55" x2="65" y2="41" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
      <line x1="80" y1="55" x2="80" y2="41" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
      
      {/* Network nodes for modern touch */}
      <circle cx="15" cy="70" r="3" fill="currentColor" opacity="0.4"/>
      <circle cx="35" cy="75" r="3" fill="currentColor" opacity="0.4"/>
      <circle cx="55" cy="70" r="3" fill="currentColor" opacity="0.4"/>
      <line x1="15" y1="70" x2="35" y2="75" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
      <line x1="35" y1="75" x2="55" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
    </svg>
  );
};

export default FamilyIcon;
