'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Loader2, Save } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { MapPicker } from '@/components/ui/MapPicker';
import { addressSchema, AddressInput } from '@/lib/validations/address.schema';
import { createAddressAction, updateAddressAction } from '@/lib/actions/actions';
import { Address } from '@/types';

interface AddressFormProps {
  userId: string;
  initialAddress?: Address | null;
  onSuccess: (address: Address) => void;
  onCancel: () => void;
}

export function AddressForm({ userId, initialAddress, onSuccess, onCancel }: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const isEdit = !!initialAddress;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: initialAddress?.full_name || '',
      phone: initialAddress?.phone || '',
      addressLine1: initialAddress?.address_line1 || '',
      addressLine2: initialAddress?.address_line2 || '',
      city: initialAddress?.city || '',
      state: initialAddress?.state || '',
      postalCode: initialAddress?.postal_code || '',
      country: initialAddress?.country || 'India',
      isDefault: initialAddress?.is_default || false,
      latitude: initialAddress?.latitude ?? undefined,
      longitude: initialAddress?.longitude ?? undefined,
    },
  });

  const watchLat = watch('latitude');
  const watchLng = watch('longitude');

  const onLocationSelect = (loc: {
    lat: number;
    lng: number;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => {
    setValue('latitude', loc.lat);
    setValue('longitude', loc.lng);
    setValue('addressLine1', loc.addressLine1);
    if (loc.addressLine2) setValue('addressLine2', loc.addressLine2);
    setValue('city', loc.city);
    setValue('state', loc.state);
    setValue('postalCode', loc.postalCode);
    setValue('country', loc.country);
    toast.success('Address coordinates selected!');
  };

  const onSubmit = async (data: AddressInput) => {
    setLoading(true);
    try {
      const payload = {
        full_name: data.fullName,
        phone: data.phone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        postal_code: data.postalCode,
        country: data.country,
        is_default: data.isDefault,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      };

      let res;
      if (isEdit && initialAddress) {
        res = await updateAddressAction(initialAddress.id, payload, userId);
      } else {
        res = await createAddressAction(payload, userId);
      }

      if (res.error || !res.data) {
        throw new Error(res.error || 'Failed to save address.');
      }

      toast.success(isEdit ? 'Address updated successfully!' : 'Address added successfully!');
      onSuccess(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onError = (formErrors: any) => {
    if (formErrors.latitude || formErrors.longitude) {
      toast.error('Please pinpoint your address on the map before saving.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col h-full max-h-[90vh] overflow-hidden flex-1">
      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center select-none shrink-0 pb-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isEdit ? 'Modify Address' : 'New Delivery Address'}
          </h4>
        </div>

        {/* Address Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder="Recipient Name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label="Phone Number"
            placeholder="e.g. +91 9876543210"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Address Line 1"
            placeholder="House/Flat No., Building, Street"
            error={errors.addressLine1?.message}
            {...register('addressLine1')}
          />
          <Input
            label="Address Line 2 (Optional)"
            placeholder="Locality, Land Mark"
            error={errors.addressLine2?.message}
            {...register('addressLine2')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            placeholder="e.g. Bangalore"
            error={errors.city?.message}
            {...register('city')}
          />
          <Input
            label="State"
            placeholder="e.g. Karnataka"
            error={errors.state?.message}
            {...register('state')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Pincode"
            placeholder="e.g. 560001"
            error={errors.postalCode?.message}
            {...register('postalCode')}
          />
          <Input
            label="Country"
            placeholder="e.g. India"
            error={errors.country?.message}
            {...register('country')}
          />
        </div>

        {/* Default Address Checkbox */}
        <div className="flex items-center gap-2 select-none py-1">
          <input
            type="checkbox"
            id="isDefault"
            className="w-4.5 h-4.5 accent-primary rounded border-border"
            {...register('isDefault')}
          />
          <label htmlFor="isDefault" className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">
            Set as my default shipping address
          </label>
        </div>

        {/* Map Pinpoint Section (Required at the end of the form) */}
        <div className="flex flex-col gap-3 border-t border-border pt-6 mt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
            <MapPin className="w-3.5 h-3.5 text-primary" /> Pinpoint Delivery Location (Required)
          </label>

          {/* Map Validation Error */}
          {(errors.latitude || errors.longitude) && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-2.5 text-xs font-semibold select-none flex items-center gap-1.5 animate-fade-in">
              ⚠️ {errors.latitude?.message || errors.longitude?.message || 'Please pinpoint your address on the map.'}
            </div>
          )}

          <div className="animate-fade-in">
            <MapPicker
              onLocationSelect={onLocationSelect}
              initialLat={watchLat || undefined}
              initialLng={watchLng || undefined}
            />
          </div>
        </div>
      </div>

      {/* Static Buttons Footer (Always visible at the bottom) */}
      <div className="flex justify-end gap-3 border-t border-border p-6 bg-card shrink-0 select-none">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="text-xs font-bold uppercase tracking-wider"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          disabled={loading}
          className="text-xs font-bold uppercase tracking-wider gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          Save Address
        </Button>
      </div>
    </form>
  );
}
