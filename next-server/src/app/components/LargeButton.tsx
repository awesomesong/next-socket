import { Button } from '@heroui/react';

type LargeButtonProps = {
  children: string;
  onClick?: () => void;
  disabled?: boolean;
}

const LargeButton = ({ children, onClick, disabled }: LargeButtonProps) => {
  return (
    <Button
      color="default"
      variant="ghost"
      radius="lg"
      className='min-w-10'
      onPress={onClick}
      isDisabled={disabled}
    >
      {children}
    </Button>
  )
}

export default LargeButton;
