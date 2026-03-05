import { useI18n } from '../contexts/I18nContext'
import AppleButton from './AppleButton'

const STORAGE_KEY = 'resumeMasterOnboardingDone'

export function getOnboardingDone() {
  try {
    return !!localStorage.getItem(STORAGE_KEY)
  } catch (_) {
    return false
  }
}

export function setOnboardingDone() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch (_) {}
}

function OnboardingOverlay({ onClose }) {
  const { t } = useI18n()

  const handleGotIt = () => {
    setOnboardingDone()
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">{t('onboardingWelcome')}</h2>
          <ol className="space-y-4 text-left mb-8">
            <li>
              <h3 className="font-medium text-emerald-200 mb-1">{t('onboardingStep1Title')}</h3>
              <p className="text-sm text-slate-300">{t('onboardingStep1Desc')}</p>
            </li>
            <li>
              <h3 className="font-medium text-emerald-200 mb-1">{t('onboardingStep2Title')}</h3>
              <p className="text-sm text-slate-300">{t('onboardingStep2Desc')}</p>
            </li>
            <li>
              <h3 className="font-medium text-emerald-200 mb-1">{t('onboardingStep3Title')}</h3>
              <p className="text-sm text-slate-300">{t('onboardingStep3Desc')}</p>
            </li>
          </ol>
          <AppleButton onClick={handleGotIt} className="w-full !py-3">
            {t('onboardingGotIt')}
          </AppleButton>
        </div>
      </div>
    </div>
  )
}

export default OnboardingOverlay
