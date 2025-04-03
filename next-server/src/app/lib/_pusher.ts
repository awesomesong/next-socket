import Pusher from 'pusher';
import PusherClient from 'pusher-js';

export const pusherServer = new Pusher({
    appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.NEXT_PUBLIC_PUSHER_APP_SECRET!,
    cluster: `${process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER}`,
    useTLS: true,
});

export const pusherClient = new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    {
        channelAuthorization: {
            endpoint: '/api/pusher/auth',
            transport: 'ajax'
        },
        cluster: `${process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER}`,
    }
);

