import { Button } from '@heroui/react';

type LargeButtonProps = {
  children: string;
  onClick?: () => void;
}

const LargeButton = ({ children, onClick }: LargeButtonProps) => {
  return (
    <Button 
      color="default"
      variant="ghost"
      radius="lg"
      className='min-w-10'
      onPress={onClick}
    >
      {children}
    </Button>
  )
}

export default LargeButton;
