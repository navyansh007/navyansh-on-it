import Composer from '../../components/Composer'

export const metadata = {
  title: 'Compose',
  description: 'Set new type for Navyansh On It.',
  robots: { index: false, follow: false },
}

export default function WritePage() {
  return (
    <div className="page">
      <Composer />
    </div>
  )
}
