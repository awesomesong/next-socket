
type Props = {
    message: string;
}

const StatusMessage = ({ message }: Props ) => {
    return (
        <p className='flex justify-center'>
            { message }
        </p>
    )
}

export default StatusMessage
