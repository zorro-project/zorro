Configuration file for self-hosted Posthog

EKS cluster named `zorro-posthog`. Kubectl cluster name `zorro-posthog.us-west-2.eksctl.io`.

Based on instructions at https://posthog.com/docs/self-host/deploy/aws

Deploy command used:

```sh
helm upgrade --install -f values.yaml --timeout 20m --create-namespace --namespace posthog posthog posthog/posthog --wait --wait-for-jobs --debug
```
