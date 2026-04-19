import RegisterScreen from '../src/screens/auth/RegisterScreen';
import { useRouter } from 'expo-router';

export default function Register() {
    const router = useRouter();
    return (
        <RegisterScreen
            navigation={{
                navigate: (screen: string) => router.push(`/${screen.toLowerCase()}` as any),
                goBack:   () => router.back(),
            }}
        />
    );
}