# Plantation Tracker integration

Install KWI in the Plantation Tracker repository and call it from the server-side weather/data layer or a controlled client service.

```ts
const result = await kwi.analyze({
  location: {
    latitude: plantation.latitude,
    longitude: plantation.longitude,
    name: plantation.name,
    district: plantation.district,
    country: 'Bangladesh',
  },
  activeCrops: plantation.crops,
});
```

Keep KWI results separate from plantation validation state. A weather risk must never automatically invalidate a plantation record.
