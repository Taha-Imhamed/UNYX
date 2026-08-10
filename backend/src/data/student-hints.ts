import type { StudentHint } from '../../../shared/types/index.js'

const hints: Record<string, StudentHint[]> = {
  'software-engineering': [
    {
      title: 'VS Code + Dev Containers',
      description: 'Install VS Code and the Remote - Containers extension, then open the shared dev container (`.devcontainer`) from the syllabus repo.',
      link: 'https://code.visualstudio.com/',
    },
    {
      title: 'Node.js 18 + npm',
      description: 'Use Node 18 LTS for npm installs; run `nvm install 18 && nvm use 18` so CLI tooling matches CI builds.',
    },
    {
      title: 'Git + SSH key',
      description: 'Upload your SSH key to the campus Git server and enable `git config --global credential.helper store` to avoid repeated prompts.',
      os: 'mac',
    },
  ],
  'data-science': [
    {
      title: 'Anaconda & Jupyter Lab',
      description: 'Install Anaconda (Python 3.10), update `pip`, and run `jupyter lab` to verify kernels connect before lab day.',
      link: 'https://www.anaconda.com/',
    },
    {
      title: 'R + tidyverse',
      description: 'Install R 4.x + the tidyverse; run `install.packages(c("tidyverse","readr","dbplyr"))` ahead of statistics labs.',
    },
    {
      title: 'PostgreSQL CLI + pgcli',
      description: 'Run a local Postgres node and try `psql`/`pgcli` connections to the practice database for ETL exercises.',
      os: 'windows',
    },
  ],
  cybersecurity: [
    {
      title: 'Burp Suite Community',
      description: 'Download Burp Suite, trust its certificate in Firefox/Chrome, and practice intercepting traffic before the secure coding labs.',
      link: 'https://portswigger.net/burp/communitydownload',
    },
    {
      title: 'Docker + Kali',
      description: 'Install Docker Desktop and pull the Kali Linux container used in the hands-on labs (`docker pull kalilinux/kali-rolling`).',
      os: 'mac',
    },
    {
      title: 'Virtualization on Windows',
      description: 'Enable Hyper-V/WSL2 so the lab VMs run; run `wsl --update` and restart if you hit kernel issues.',
      os: 'windows',
    },
  ],
  general: [
    {
      title: 'Campus VPN',
      description: 'Install the ARU VPN client for remote access to labs, repositories, and campus databases.',
    },
    {
      title: 'Single sign-on',
      description: 'Log into the ARU identity portal and bookmark it; use it for Microsoft/Google licenses and software downloads.',
    },
  ],
}

export default hints
