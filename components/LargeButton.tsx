import { Button } from '@nextui-org/react';

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
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export default LargeButton;
