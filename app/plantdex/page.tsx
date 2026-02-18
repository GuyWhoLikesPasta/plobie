import { redirect } from 'next/navigation';

export default function PlantdexPage() {
  redirect('/my-plants?tab=plantdex');
}
