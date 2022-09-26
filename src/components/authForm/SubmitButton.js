import styled from "styled-components";

const SubmitButton = styled.button.attrs(() => ({ type: "submit" }))`
  background-color: ${(p) => p.bgcolor || "rgb(88, 101, 242)"};
  border: 0;
  border-radius: 4px;
  padding: 12px 8px;
  margin: 16px 0 12px 0;
  color: white;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${(p) => p.bgcolorhover || "rgb(88, 101, 242)"};
    cursor: pointer;
  }

  &:disabled {
    background-color: #777;
  }
`;

export default SubmitButton;
