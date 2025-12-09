import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';

export const minutesPerUnit = 60;

interface PinChannelModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (units: number) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`;

const Description = styled.p`
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Input = styled.input`
  width: 80px;
  padding: 8px;
  border: 1px solid var(--background-tertiary);
  border-radius: 4px;
  background-color: var(--background-secondary);
  color: var(--text-normal);
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: var(--brand);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const PinChannelModal: React.FC<PinChannelModalProps> = ({ isOpen, onClose, onConfirm }) => {
	const [units, setUnits] = useState(1);

	const handleConfirm = () => {
		onConfirm(units);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<Container>
				<Title>Pin Channel</Title>
				<Description>
					Enter the number of units to pin this channel. Each unit represents {minutesPerUnit}{' '}
					minutes.
				</Description>
				<InputContainer>
					<Input
						type="number"
						min="1"
						value={units}
						onChange={(e) => setUnits(Number.parseInt(e.target.value, 10) || 1)}
					/>
					<span>units</span>
				</InputContainer>
				<ButtonContainer>
					<Button onClick={onClose} variant="secondary">
						Cancel
					</Button>
					<Button onClick={handleConfirm} variant="primary">
						Pin Channel
					</Button>
				</ButtonContainer>
			</Container>
		</Modal>
	);
};

export default PinChannelModal;
