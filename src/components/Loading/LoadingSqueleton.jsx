import React from 'react';
import styled, { keyframes } from 'styled-components';

const wave = keyframes`
  0% {
    transform: scaleY(0.2);
  }
  50% {
    transform: scaleY(1);
  }
  100% {
    transform: scaleY(0.2);
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  gap: 6px;
`;

const Bar = styled.div`
  width: 12px;
  height: 40px;
  background: ${props => props.color || '#1e0c1b'};
  border-radius: 4px;
  animation: ${wave} 1.2s ease-in-out infinite;
  
  &:nth-child(1) {
    animation-delay: 0s;
  }
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

const LoadingSkeleton = ({ color }) => {
  return (
    <LoaderContainer>
      <Bar color={color} />
      <Bar color={color} />
      <Bar color={color} />
    </LoaderContainer>
  );
};

export default LoadingSkeleton;