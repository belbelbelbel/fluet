import { SignIn } from '@clerk/nextjs'

export default function signInPage() {
    return (
        <div className='flex justify-center  min-h-screen items-center bg-black'>
            <SignIn
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-blue-500 hover:bg-blue-600 normal-case text-sm'
                    }
                }}
            />
        </div>
    )
}