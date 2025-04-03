import { IconType } from "react-icons/lib";
import Button from "./Button";

interface AuthSocialButtonProps {
    icon: IconType;
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}

const AuthSocialButton: React.FC<AuthSocialButtonProps> = ({
    icon: Icon,
    onClick,
    children,
    disabled,
}) => {
  return (
    <Button
        type="button"
        onClick={onClick}
        fullWidth
        color="default"
        variant="ghost"
        disabled={disabled}
    >
        <span>
            <Icon />
        </span>
        <span className="text-sm">
            {children}
        </span>
    </Button>
  )
}

export default AuthSocialButton;
