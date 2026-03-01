import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical: string;
  type?: string;
  image?: string;
  article?: {
    publishedTime?: string;
    author?: string;
  };
}

export function SEO({ title, description, canonical, type = 'website', image, article }: SEOProps) {
  const siteUrl = 'https://adiology.io';
  const defaultImage = `${siteUrl}/og-image.png`;
  const fullTitle = title.includes('Adiology') ? title : `${title} | Adiology`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="Adiology" />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />
      
      {/* Article-specific */}
      {article?.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
      {article?.author && <meta property="article:author" content={article.author} />}
    </Helmet>
  );
}

export default SEO;
