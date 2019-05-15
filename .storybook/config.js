import { configure } from '@storybook/react'

configure(loadStories, module)

function loadStories() { require('all:part:story') }
