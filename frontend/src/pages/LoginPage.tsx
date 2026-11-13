import { AccessPage, type AccessPageProps } from './AccessPage';

export function LoginPage(props: Omit<AccessPageProps, 'mode'> = {}) {
    return <AccessPage {...props} mode="login" />;
}
