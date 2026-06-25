'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Package, Heart, LogOut, LayoutDashboard, ShoppingBag, MapPin, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AddressForm } from '@/components/account/AddressForm';
import { logoutAction, deleteAddressAction, setDefaultAddressAction } from '@/lib/actions/actions';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/formatPrice';
import { ROUTES } from '@/lib/utils/routes';
import { Order, WishlistItem, Profile, Address } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { toast } from '@/components/ui/Toast';

interface AccountClientProps {
  profile: Profile;
  orders: Order[];
  wishlist: WishlistItem[];
  user: any;
  initialAddresses: Address[];
}

export function AccountClient({ profile, orders, wishlist, user, initialAddresses }: AccountClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses'>('orders');
  const [loggingOut, setLoggingOut] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // tracks loading for specific address ID actions

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutAction();
    await supabase.auth.signOut();
    router.replace(ROUTES.home);
  };

  const handleSetDefault = async (addressId: string) => {
    setActionLoading(addressId);
    try {
      const res = await setDefaultAddressAction(addressId, user.id);
      if (res.error || !res.data) {
        throw new Error(res.error || 'Failed to update default address.');
      }
      // Update local state: set selected to true, others to false
      setAddresses(prev =>
        prev.map(addr => ({
          ...addr,
          is_default: addr.id === addressId,
        })).sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
      );
      toast.success('Default address updated!');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setActionLoading(addressId);
    try {
      const res = await deleteAddressAction(addressId, user.id);
      if (res.error) throw new Error(res.error);
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      toast.success('Address removed.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete address.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormSuccess = (address: Address) => {
    if (selectedAddress) {
      // Edit mode: replace address
      setAddresses(prev => {
        const updated = prev.map(addr => (addr.id === address.id ? address : addr));
        if (address.is_default) {
          return updated.map(addr => ({
            ...addr,
            is_default: addr.id === address.id,
          })).sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
        }
        return updated;
      });
    } else {
      // Add mode: append/prepend address
      setAddresses(prev => {
        const updated = [address, ...prev];
        if (address.is_default) {
          return updated.map(addr => ({
            ...addr,
            is_default: addr.id === address.id,
          })).sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
        }
        return updated;
      });
    }
    setIsFormOpen(false);
    setSelectedAddress(null);
  };

  const openAddForm = () => {
    setSelectedAddress(null);
    setIsFormOpen(true);
  };

  const openEditForm = (address: Address) => {
    setSelectedAddress(address);
    setIsFormOpen(true);
  };

  return (
    <div className="w-full py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8 mb-12 select-none">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-black select-none">
            {profile.full_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black uppercase text-foreground">{profile.full_name || 'Customer'}</h1>
              {profile.role === 'admin' && (
                <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
          </div>
        </div>

        <div className="flex gap-3">
          {profile.role === 'admin' && (
            <Button href={ROUTES.admin} variant="outline" size="sm" className="text-xs uppercase tracking-wider font-bold">
              <LayoutDashboard className="w-4 h-4 mr-2" /> Admin Dashboard
            </Button>
          )}
          <Button variant="destructive" size="sm" className="text-xs uppercase tracking-wider font-bold" onClick={handleLogout} isLoading={loggingOut}>
            <LogOut className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Left Nav */}
        <nav className="w-full lg:w-64 shrink-0 flex flex-col gap-1 border border-border bg-card p-3 rounded-xl shadow-xs select-none">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-left ${
              activeTab === 'orders'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Package className="w-4.5 h-4.5" /> Order History ({orders.length})
          </button>
          
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-left ${
              activeTab === 'wishlist'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Heart className="w-4.5 h-4.5" /> My Wishlist ({wishlist.length})
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-left ${
              activeTab === 'addresses'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <MapPin className="w-4.5 h-4.5" /> My Addresses ({addresses.length})
          </button>
        </nav>

        {/* Right Content */}
        <div className="flex-1 w-full">
          
          {/* 1. ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">Your Orders</h2>
              
              {orders.length === 0 ? (
                <div className="py-16 border border-dashed border-border rounded-xl text-center flex flex-col items-center gap-4">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">You haven't placed any orders yet.</p>
                  <Button href={ROUTES.products} size="sm" className="text-xs uppercase tracking-wider font-bold">
                    Shop Products
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-border bg-card rounded-xl overflow-hidden shadow-xs">
                      {/* Summary Panel */}
                      <div className="px-6 py-4 bg-muted/40 border-b border-border flex flex-wrap justify-between items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <div className="flex gap-6">
                          <div>
                            <p className="text-[10px]">Date Placed</p>
                            <p className="text-foreground font-bold mt-0.5">
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px]">Total Paid</p>
                            <p className="text-foreground font-bold mt-0.5">{formatPrice(order.total)}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="p-6 flex flex-col gap-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-center">
                            <div className="relative w-10 h-14 bg-muted rounded overflow-hidden shrink-0 border border-border">
                              {item.image_url ? (
                                <Image src={item.image_url} alt={item.name} fill sizes="40px" className="object-cover" />
                              ) : (
                                <div className="w-full h-full bg-muted" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-foreground truncate">{item.name}</h4>
                              {item.variant_name && <p className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5">{item.variant_name}</p>}
                              <p className="text-[9px] text-muted-foreground mt-1">Quantity: {item.quantity}</p>
                            </div>
                            <span className="text-xs font-bold text-foreground shrink-0">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. WISHLIST TAB */}
          {activeTab === 'wishlist' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">Saved Items</h2>

              {wishlist.length === 0 ? (
                <div className="py-16 border border-dashed border-border rounded-xl text-center flex flex-col items-center gap-4">
                  <Heart className="w-10 h-10 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Your wishlist is empty.</p>
                  <Button href={ROUTES.products} size="sm" className="text-xs uppercase tracking-wider font-bold">
                    Browse Catalog
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {wishlist.map((item) => (
                    item.product && (
                      <ProductCard key={item.id} product={item.product} user={user} />
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center select-none border-b border-border pb-4 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Saved Addresses</h2>
                <Button
                  onClick={openAddForm}
                  size="sm"
                  className="text-xs uppercase tracking-wider font-bold gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </Button>
              </div>

              {addresses.length === 0 ? (
                <div className="py-16 border border-dashed border-border rounded-xl text-center flex flex-col items-center gap-4 select-none">
                  <MapPin className="w-10 h-10 text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">No addresses saved yet.</p>
                  <Button onClick={openAddForm} size="sm" className="text-xs uppercase tracking-wider font-bold">
                    Add Address Now
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`relative border bg-card rounded-xl p-6 shadow-xs flex flex-col justify-between transition-all ${
                        address.is_default ? 'border-primary bg-primary/[0.02]' : 'border-border'
                      }`}
                    >
                      {/* Address Card Details */}
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <span className="font-bold text-sm text-foreground uppercase tracking-tight block">
                            {address.full_name}
                          </span>
                          
                          {address.is_default && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider select-none shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Default
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 text-xs text-muted-foreground font-medium">
                          <p>{address.address_line1}</p>
                          {address.address_line2 && <p>{address.address_line2}</p>}
                          <p>{address.city}, {address.state} - <span className="font-bold text-foreground">{address.postal_code}</span></p>
                          <p>{address.country}</p>
                          <p className="mt-2 text-foreground font-bold">Phone: {address.phone}</p>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex gap-2 justify-end border-t border-border pt-4 mt-6 select-none shrink-0">
                        {!address.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading !== null}
                            onClick={() => handleSetDefault(address.id)}
                            className="text-[10px] uppercase tracking-wider font-bold py-1 px-3 h-8 bg-transparent"
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading !== null}
                          onClick={() => openEditForm(address)}
                          className="text-[10px] uppercase tracking-wider font-bold py-1 px-3 h-8 gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading !== null || address.is_default}
                          onClick={() => handleDelete(address.id)}
                          title={address.is_default ? "Cannot delete default shipping address" : "Delete address"}
                          className="text-[10px] uppercase tracking-wider font-bold py-1 px-3 h-8 gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Address Form Dialog Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedAddress(null);
        }}
        title={selectedAddress ? 'Edit Address' : 'Add New Address'}
        className="max-w-2xl"
      >
        <AddressForm
          userId={user.id}
          initialAddress={selectedAddress}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedAddress(null);
          }}
        />
      </Modal>

    </div>
  );
}
