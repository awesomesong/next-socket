const getUnReadCount = async () => {

    const res = await fetch(`/api/messages/unReadCount`,{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }); 
    
        const { unReadCount, message } = await res.json();
    
        return { unReadCount, message };
};

export default getUnReadCount;