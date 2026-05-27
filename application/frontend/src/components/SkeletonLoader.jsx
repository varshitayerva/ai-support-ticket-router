import React from 'react';
import { Skeleton, Card, CardContent, Box } from '@mui/material';

function SkeletonLoader({ count = 3 }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent>
            <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={20} />
            <Skeleton variant="text" height={20} width="80%" />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default SkeletonLoader;
