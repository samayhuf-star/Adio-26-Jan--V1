import { useState, useEffect } from 'react';
import { subscribeToDataSource, getDataSource, DataSourceType } from '../utils/historyService';

export function useDataSource(): DataSourceType {
  const [dataSource, setDataSource] = useState<DataSourceType>(getDataSource);

  useEffect(() => {
    const unsubscribe = subscribeToDataSource(setDataSource);
    return unsubscribe;
  }, []);

  return dataSource;
}
