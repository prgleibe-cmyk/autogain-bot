import { useEffect, useRef } from 'react';

export const useDataIngestion = (isBrokerConnected: boolean, activeAssets: string[]) => {
    const isRunningRef = useRef<boolean>(false);

    useEffect(() => {
        isRunningRef.current = isBrokerConnected && (activeAssets?.length || 0) > 0;

        if (isRunningRef.current) {
            console.log(`[Ingestion] Ativo. Monitorando ${activeAssets.length} ativos.`);
        } else {
            console.log(`[Ingestion] Inativo.`);
        }
    }, [isBrokerConnected, activeAssets]);

    // ⚠️ REMOVIDO completamente:
    // - bridgeApi.getMarketDataBulk
    // - loop manual
    // - controle de falha
    // - concorrência
    // - timers
    // - duplicação de requisições

    return { status: isRunningRef.current ? 'INGESTING' : 'IDLE' };
};