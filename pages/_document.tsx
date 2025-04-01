import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Medicine Identifier App - Find information about medications, check drug interactions, and set medication reminders"
        />
        <meta name="theme-color" content="#3b82f6" />
      </Head>
      <body className="bg-gray-50 min-h-screen">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}