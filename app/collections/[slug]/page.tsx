import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCollectionBySlugAction, getProductsAction } from '@/lib/actions/actions';
import { CollectionDetailClient } from '@/components/collections/CollectionDetailClient';

export const revalidate = 60; // Cache and revalidate collection details every 60s

interface CollectionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  
  // Fetch collection
  const collectionRes = await getCollectionBySlugAction(slug);
  if (!collectionRes.data) {
    return notFound();
  }

  const collection = collectionRes.data;

  // Fetch products in this collection (status = 'active')
  const productsRes = await getProductsAction({
    collectionId: collection.id,
    status: 'active',
    limit: 100, // Load a reasonable catalog chunk for client-side filters
  });
  
  const products = productsRes.data?.products || [];

  // Fetch current user details
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <CollectionDetailClient
      collection={collection}
      initialProducts={products}
      user={user}
    />
  );
}
