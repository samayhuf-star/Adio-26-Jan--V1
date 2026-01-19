import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { SupportPanel } from './SupportPanel';
import { HelpSupport } from './HelpSupport';

export const SupportHelpCombined = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <Tabs defaultValue="support" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="help">Help & Documentation</TabsTrigger>
        </TabsList>
        <TabsContent value="support" className="mt-0">
          <SupportPanel />
        </TabsContent>
        <TabsContent value="help" className="mt-0">
          <HelpSupport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

